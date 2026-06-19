const { createApp } = require('./src/server/app');

const PORT = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`Typing Speed app running at http://localhost:${PORT}`);
});
