const TelegramBot = require("node-telegram-bot-api");

const token = '1250390966:AAGsECWtMTunFxeGQP9Vx2aONDz5PU1IyIw';

const bot = new TelegramBot(token, {polling: true});

const myId = 1079095663;
const maxId = 1163845029;

const generalArr = ['Математика', 'Фізика', 'Англійська мова', 'Хімія', 'Інформатика', 'Історія', 'Географія', 'Укр.мова/укр.літ.'];
const techArr = ['Математика', 'Фізика', 'Хімія', 'Інформатика'];
const humArr = ['Англійська мова', 'Історія', 'Географія', 'Укр.мова/укр.літ.'];

const sessions = {};

const haveSession = (id) => sessions [id] !== undefined;

const createSession = (id) => {
  sessions [id] = {
                    state: 0,
                    sendId: 0,
                    subject: '',
                    uname: '',
                    ufirst: '',
                    ulast: '',
                    urgency: '',
                    description: [],
                    pictures: [],
                    captions: [],
                  };
};

const deleteSession = (id) => delete sessions [id];

// const haveAdminSession = (id) => adminsessions [id] !== undefined;
// const createAdminSession = (id) => {
//   adminsessions [id] = {
//                         state: 0,
//                        }
// }

const keyboards = {  
  chooseSubject: {
      reply_markup: {
          keyboard: [
              [{text: "Математика"}, {text: "Фізика"}],
              [{text: "Англійська мова"}, {text: "Хімія"}],
              [{text: "Інформатика"}, {text: "Історія"}],
              [{text: "Географія"}, {text: "Укр.мова/укр.літ."}]
          ]
      }
  },
  chooseUrgency: {
    reply_markup: {
      keyboard: [
        [{text: 'Отримати конспект'}],
        [{text: 'Зробити замовлення'}]
      ]
    }
  },
  finish: {
    reply_markup: {
      keyboard: [
       [{text: 'FINISH'}]
      ]
    }
  },
  approveOrReject : {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{text: 'ПРИНЯТЬ', callback_data: 'approve'}],
        [{text: 'ОТКАЗАТЬ', callback_data: 'reject'}]       
      ]
    })
  },
};

// const approveOrReject = {
//   reply_markup: JSON.stringify({
//     inline_keyboard: [
//       [{text: 'ПРИНЯТЬ', callback_data: 'approve'}],
//       [{text: 'ОТКАЗАТЬ', callback_data: 'reject'}]       
//     ]
//   })
// },

const optRemove = {
  reply_markup: {
     remove_keyboard: true
  }
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  createSession(chatId);

  sessions[chatId].state = 1;

  bot.sendMessage(chatId, 'Для початку вибери предмет.', keyboards.chooseSubject);
});

bot.on('message', (msg) => {

  if (msg.text === '/start') {
    return;
  }

  const chatId = msg.chat.id;

  if ((!haveSession(chatId)) && (chatId !== myId) && (chatId !== maxId) ) {
    bot.sendMessage(chatId, 'Введи "/start", щоб розпочати.');
    return;
  }

  if ((techArr.includes(msg.text)) && (sessions[chatId].state === 1)) {
    sessions[chatId].sendId = myId;
    bot.sendMessage(chatId, 'Чудово. Скажи, ти хотів би зробити замовлення чи отримати теоретичний конспект?', keyboards.chooseUrgency);
    sessions[chatId].subject = msg.text;
    sessions[chatId].state = 2;
  } else if ((humArr.includes(msg.text)) && (sessions[chatId].state === 1)) {
    sessions[chatId].sendId = maxId;
    bot.sendMessage(chatId, 'Чудово. Скажіть, ти хотів би зробити замовлення чи отримати теоретичний конспект?', keyboards.chooseUrgency);
    sessions[chatId].subject = msg.text;
    sessions[chatId].state = 2;
  } else if ((!generalArr.includes(msg.text)) && (sessions[chatId].state === 1)) {
    bot.sendMessage(chatId, 'обери предмет зі списку.');
  }

  if (sessions[chatId].state === 2) {
    sessions[chatId].uname = msg.from.username;
    sessions[chatId].ufirst = msg.from.first_name;
    sessions[chatId].ulast = msg.from.last_name;
    sessions[chatId].urgency = msg.text;

    if (msg.text === 'Отримати конспект') {
      sessions[chatId].state = 3;
      let sessionsProperties = [];
      let outputString = '';
      for (let i in sessions[chatId]) {
        if ((i === 'state') || (i === 'sendId') || (i === 'captions') || (i === 'pictures') ||
        (i === 'description') || !(sessions[chatId][i])) continue;
        else if (i === 'uname') sessionsProperties.push(`@${sessions[chatId][i]}`);
        else sessionsProperties.push(sessions[chatId][i]);
      }
  
      for (let i = 0; i < sessionsProperties.length; i++) {
          outputString += (sessionsProperties[i] + '\n');
      }
  
      bot.sendMessage(sessions[chatId].sendId, outputString);
      bot.sendMessage(chatId, 'Прийнято! Найближчим часом наш агент надішле тобі його.', optRemove);
      deleteSession(chatId);
    } else if (msg.text === 'Зробити замовлення') {
      bot.sendMessage(chatId, 'Зрозумів тебе, надішли, будь ласка, умову завдання, прикріпи необхідні фото, після чого натисни кнопку "FINISH", щоб відправити дані.', keyboards.finish);
      sessions[chatId].state = 3;
      } else {
        bot.sendMessage(chatId, 'Будь ласка, обери один із варіантів.');
      }
  }

  if ((sessions[chatId].state === 3) && (msg.text !== sessions[chatId].urgency)) {
    if (msg.text) {
      sessions[chatId].description.push(msg.text);
    }
    else {
      sessions[chatId].description.pop();
    }
    sessions[chatId].description.push('\n');
  }

  if (msg.text === 'FINISH') {
    sessions[chatId].finishMessageId = msg.message_id;
    let sessionsProperties = [];
    let outputString = '';
    let countNewLines = 0;
    for (let i in sessions[chatId]) {
      if ((i === 'state') || (i === 'sendId') || (i === 'captions') || (i === 'pictures') ||
      (i === 'description') || (i === 'finishMessageId') || !(sessions[chatId][i])) continue;
      else if (i === 'uname') sessionsProperties.push(`@${sessions[chatId][i]}`);
      else sessionsProperties.push(sessions[chatId][i]);
    }

    for (let i = 0; i < sessionsProperties.length; i++) {
        outputString += (sessionsProperties[i] + '\n');
        if (outputString.includes('\n')) countNewLines ++;
        if (countNewLines === 4) outputString += '\n';
    }

    outputString += (sessions[chatId].description.join('\n'));

    bot.sendMessage(sessions[chatId].sendId, outputString);

    for (let i in sessions[chatId].pictures) {
      bot.sendPhoto(sessions[chatId].sendId, sessions[chatId].pictures[i].file_id, {caption: sessions[chatId].captions[i]});
    }

    //bot.sendMessage(sessions[chatId].sendId, 'Принять?', keyboards.approveOrReject);
    bot.sendMessage(chatId, 'Прийнято! Зажди, доки наш агент зв\'яжеться з тобою.', optRemove);
    deleteSession(chatId);
    
  }

  /*if ((chatId === sessions[chatId].sendId) && (msg.text === 'ПРИНЯТЬ')) {
    bot.sendMessage(chatId, 'Принято.', optRemove);
    deleteSession(chatId);
  } else if ((chatId === sessions[chatId].sendId) && (msg.text === 'ОТКАЗАТЬ')) {
    bot.sendMessage(chatId, 'Отказано', optRemove);
    bot.sendMessage(clientId, 'Сорри');
    deleteSession(chatId);
  }*/
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg.photo && msg.photo[0]) {
    sessions[chatId].pictures.push(await bot.getFile(msg.photo[0].file_id));
    sessions[chatId].captions.push(msg.caption);
  }
});