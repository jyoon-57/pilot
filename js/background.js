const img = ['0.jpg', '1.jpg', '2.png'];

const randomImg = img[Math.round(Math.random() * (img.length - 1))];
const imgTag = document.createElement('img');

imgTag.src = `img/${randomImg}`;

document.body.appendChild(imgTag);

imgTag.onload = () => {};
