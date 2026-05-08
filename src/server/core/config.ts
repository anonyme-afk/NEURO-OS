export const SystemConfig = {
  airGappedMode: process.env.AIR_GAPPED_MODE === 'true',
  mtlsEnabled: process.env.MTLS_ENABLED === 'true',
  mqttEnabled: process.env.MQTT_ENABLED === 'true',
};
