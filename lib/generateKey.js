module.exports = function(slug, query) {
  return `${slug}-${JSON.stringify(query)}`;
};
