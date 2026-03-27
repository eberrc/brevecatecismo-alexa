const express = require('express');
const Alexa = require('ask-sdk-core');
const catecismo = require('./brevecatecismo.json');

const app = express();
app.use(express.json());

// ================= HANDLERS =================

// Quando abre a skill
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Bem-vindo ao Catecismo de Westminster. Diga, por exemplo: pergunta 1.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('Diga o número de uma pergunta.')
      .getResponse();
  }
};

// Pergunta por número
const PerguntaNumeroIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PerguntaNumeroIntent';
  },
  handle(handlerInput) {
    const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value;

    const item = catecismo[numero];

    if (!item) {
      return handlerInput.responseBuilder
        .speak('Não encontrei essa pergunta. Tente outro número.')
        .reprompt('Diga outro número de pergunta.')
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(item.resposta_ssml) // usa versão com pausas
      .withSimpleCard(`Pergunta ${numero}`, item.resposta_alexa)
      .getResponse();
  }
};

// Ajuda
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Você pode dizer: pergunta 1, pergunta 2, e assim por diante.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('Diga um número de pergunta.')
      .getResponse();
  }
};

// Cancelar ou sair
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
      );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Até logo!')
      .getResponse();
  }
};

// Erros
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(error);

    return handlerInput.responseBuilder
      .speak('Desculpe, ocorreu um erro.')
      .reprompt('Tente novamente.')
      .getResponse();
  }
};

// ================= SKILL =================

const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PerguntaNumeroIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

// ================= ENDPOINT =================

app.post('/', async (req, res) => {
  const response = await skill.invoke(req.body);
  res.json(response);
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});