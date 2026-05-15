const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    timezone: "+00:00",
    dialectOptions: {
      useUTC: false,
    },
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//#region Model definitions
db.SystemDump = require("./SystemDump")(sequelize, Sequelize);
db.Country = require("./Country")(sequelize, Sequelize);
db.Region = require("./Region")(sequelize, Sequelize);
db.District = require("./District")(sequelize, Sequelize);

db.Village = require("./Village")(sequelize, Sequelize);
db.City = require("./City")(sequelize, Sequelize);
db.Street = require("./Street")(sequelize, Sequelize);

// Chat
db.ChatRoom = require("./ChatRoom")(sequelize, Sequelize);
db.ChatMessage = require("./ChatMessage")(sequelize, Sequelize);
db.ChatRoomParticipant = require("./ChatRoomParticipant")(sequelize, Sequelize);
db.ChatMessageRead = require("./ChatMessageRead")(sequelize, Sequelize);


db.Notification = require("./Notification")(sequelize, Sequelize);

db.Log = require("./Log")(sequelize, Sequelize);
db.Config = require("./Config")(sequelize, Sequelize);
//#endregion

const modulesPath = path.join(__dirname, "../__modules__");
fs.readdirSync(modulesPath).forEach((moduleName) => {
  const moduleModelsPath = path.join(modulesPath, moduleName, "models", "_index_.js");
  if (fs.existsSync(moduleModelsPath)) {
    const moduleModels = require(moduleModelsPath)(sequelize, db);
    Object.assign(db, moduleModels);
  }
});



// Run associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

// #region Syncronization
// sequelize.sync({ alter: true }).then(()=>{
//     console.log("Synching job is OK");
// });

// db.User.sync({ alter: true });
// db.UserOtpSession.sync({ alter: true });
// db.Config.sync({ alter: true });

// Object.keys(db)?.map(async (modelKey) => {
//   try {
//     if (db[modelKey] && db[modelKey] != null) await db[modelKey]?.sync({ alter: true }).catch((e) => console.log(e));
//   } catch (e) {
//     console.error(`Error while trying to sync ${modelKey} model: `, e);
//   }
// });
//#endregion

module.exports = db;