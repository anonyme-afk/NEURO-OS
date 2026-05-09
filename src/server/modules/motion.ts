// src/server/modules/motion.ts
// @ts-ignore
import mqtt from 'mqtt';
import { eventBus } from '../core/eventBus';
import { auditLog } from '../core/security';
import { dbOps } from '../core/database';

// Interface standardisée pour toute action physique
export interface BrainAction {
  type: 'home_assistant' | 'mqtt' | 'http_webhook' | 'ros2_stub';
  target: string;      // Ex: "light.salon" ou "robot/arm/cmd"
  action: string;      // Ex: "turn_on", "set_position"
  payload?: any;       // Paramètres additionnels
}

// ── HOME ASSISTANT (Domotique) ──────────────────────────────────────────────

export async function executeHomeAssistantAction(action: BrainAction): Promise<boolean> {
  const haUrl = process.env.HOME_ASSISTANT_URL;
  const haToken = process.env.HOME_ASSISTANT_TOKEN;

  if (!haUrl || !haToken) {
    console.warn('[Motion] Home Assistant non configuré (HA_URL ou HA_TOKEN manquant)');
    return false;
  }

  const [domain, service] = action.action.includes('.') 
    ? action.action.split('.')
    : ['homeassistant', action.action];

  const url = `${haUrl}/api/services/${domain}/${service}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${haToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity_id: action.target,
      ...action.payload
    })
  });

  const success = response.ok;

  eventBus.publish('MOTION_ACTION_EXECUTED', {
    type: 'home_assistant',
    target: action.target,
    action: action.action,
    success
  });

  auditLog('HA_ACTION', 'brain', {
    target: action.target,
    action: action.action,
    success
  });

  return success;
}

// ── MQTT (IoT / Robots) ──────────────────────────────────────────────────────

let mqttClient: mqtt.MqttClient | null = null;

export function getMqttClient(): mqtt.MqttClient | null {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  if (!brokerUrl) return null;

  // Connexion paresseuse — ne se connecte que si MQTT est configuré
  if (!mqttClient) {
    mqttClient = mqtt.connect(brokerUrl, {
      clientId: `neuro_os_${Date.now()}`,
      reconnectPeriod: 5000,
      connectTimeout: 10000
    });

    mqttClient.on('connect', () => {
      console.log('[Motion] MQTT connecté:', brokerUrl);
      eventBus.publish('MOTION_MQTT_CONNECTED', { broker: brokerUrl });
    });

    mqttClient.on('error', (err) => {
      console.warn('[Motion] MQTT erreur:', err.message);
    });
  }

  return mqttClient;
}

export async function publishMqttCommand(topic: string, payload: any): Promise<boolean> {
  const client = getMqttClient();
  if (!client) {
    console.warn('[Motion] MQTT non configuré');
    return false;
  }

  return new Promise((resolve) => {
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      const success = !err;
      eventBus.publish('MOTION_ACTION_EXECUTED', {
        type: 'mqtt',
        topic,
        success
      });
      resolve(success);
    });
  });
}

// ── ROS 2 STUB (Robot Operating System) ──────────────────────────────────────
// ROS 2 nécessite rclnodejs (Node.js binding pour ROS 2)
// Ce stub prépare la structure — activé si ROS_DOMAIN_ID est défini

export async function publishRos2Command(topic: string, messageType: string, data: any): Promise<boolean> {
  if (!process.env.ROS_DOMAIN_ID) {
    console.warn('[Motion] ROS 2 non configuré (ROS_DOMAIN_ID manquant)');
    return false;
  }

  // Stub HTTP vers un bridge ROS 2 → HTTP (rosbridge_server)
  // https://github.com/RobotWebTools/rosbridge_suite
  const rosBridgeUrl = process.env.ROSBRIDGE_URL || 'ws://localhost:9090';

  eventBus.publish('MOTION_ROS2_COMMAND', {
    topic,
    type: messageType,
    data,
    bridge: rosBridgeUrl
  });

  // Log pour traçabilité même sans exécution réelle
  auditLog('ROS2_COMMAND', 'brain', { topic, messageType });
  return true;
}

// ── DISPATCHER UNIVERSEL ──────────────────────────────────────────────────────

export async function executeAction(action: BrainAction): Promise<{ success: boolean; message: string }> {
  try {
    let success = false;

    switch (action.type) {
      case 'home_assistant':
        success = await executeHomeAssistantAction(action);
        break;

      case 'mqtt':
        success = await publishMqttCommand(action.target, {
          action: action.action,
          ...action.payload
        });
        break;

      case 'ros2_stub':
        success = await publishRos2Command(
          action.target,
          action.payload?.messageType || 'std_msgs/String',
          action.payload
        );
        break;

      case 'http_webhook':
        const webhookResponse = await fetch(action.target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: action.action, ...action.payload })
        });
        success = webhookResponse.ok;
        break;

      default:
        throw new Error(`Type d'action inconnu: ${action.type}`);
    }

    return {
      success,
      message: success ? `Action exécutée sur ${action.target}` : `Échec sur ${action.target}`
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
