from pydantic import BaseModel
from datetime import datetime


class SleepData(BaseModel):
    start_time: datetime
    end_time: datetime
    sleep_duration: str