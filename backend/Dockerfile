FROM python:3.11-slim

WORKDIR /app

# Python이 pyc 파일을 디스크에 쓰지 않도록 설정
ENV PYTHONDONTWRITEBYTECODE=1
# 버퍼링 없이 즉시 stdout/stderr로 출력이 나오도록 설정 (컨테이너 로그 모니터링 향상)
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
