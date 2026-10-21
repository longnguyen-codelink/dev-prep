if [ ! -f .env ]; then
  echo ".env file not found! Creating a new one..."
  touch .env
  echo ".env file created. It is currently empty. Please fill it with the necessary environment variables."
fi