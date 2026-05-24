class CONSTANTS {
  static PUBLIC_FOLDER = `public/`;
  static CHAT_PATH = `${this.PUBLIC_FOLDER}chats`;

  static CHAT_SIZE_LIMIT = 10;
  static USER_THUMBNAIL_SIZE = 3;

  static ARCHIVING_DAYS = 30;
  static MAX_ROWS = 1000;
  static DUMP_RETENTION_DAYS  = 7;
  static DUMP_PREFIX          = process.env.APP_NAME || 'embium';
}

module.exports = { CONSTANTS };