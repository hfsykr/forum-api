exports.up = (pgm) => {
  pgm.createTable('comments_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    comment: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"comments"',
      onDelete: 'cascade',
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade',
    },
  });

  pgm.addConstraint('comments_likes', 'unique_comment_and_owner', 'UNIQUE(comment, owner)');
};

exports.down = (pgm) => {
  pgm.dropTable('comments_likes');
};
