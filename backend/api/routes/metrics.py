import psutil
from fastapi import APIRouter

router = APIRouter()

@router.get("/live")
async def get_live_metrics():
    """Real system metrics - No simulation."""
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    net = psutil.net_io_counters()

    return {
        "system": {
            "cpu_percent": cpu,
            "ram_percent": mem.percent,
            "ram_used_gb": round(mem.used / 1e9, 2),
            "net_sent_mb": round(net.bytes_sent / 1e6, 2),
            "net_recv_mb": round(net.bytes_recv / 1e6, 2),
        },
        "status": "online"
    }
