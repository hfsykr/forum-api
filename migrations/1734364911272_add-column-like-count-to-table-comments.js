/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.addColumn('comments', {
    like_count: {
      type: 'INTEGER',
      notNull: true,
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('comments', 'like_count');
};
