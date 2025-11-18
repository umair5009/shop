// a very simple invoice generator (timestamp based)
module.exports = () => {
  const now = Date.now();
  return `INV-${now}`;
};
