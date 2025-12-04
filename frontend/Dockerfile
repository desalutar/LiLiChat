FROM nginx:alpine

# Удаляем стандартные файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем фронтенд
COPY . /usr/share/nginx/html

# Копируем кастомный конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
