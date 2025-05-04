FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Actualizar pip y asegurar que las dependencias se instalen correctamente
RUN pip install --upgrade pip && \
    # Instalar las dependencias explícitamente para asegurar que bson esté disponible
    pip install --no-cache-dir pymongo==4.6.0 dnspython==2.4.2 && \
    # Luego el resto de dependencias
    pip install --no-cache-dir -r requirements.txt

COPY run.py .
COPY app/ app/

EXPOSE 8000

CMD ["python", "run.py"]