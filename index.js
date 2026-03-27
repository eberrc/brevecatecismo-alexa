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
    return handlerInput.responseBuilder
      .speak('Bem-vindo ao Catecismo de Westminster. Diga: pergunta 1.')
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

    let numero = handlerInput.requestEnvelope.request.intent.slots?.numero?.value;

    // mapa simples para garantir reconhecimento
    const mapaNumeros = {
      "um": "1", "uma": "1",
      "dois": "2",
      "três": "3", "tres": "3",
      "quatro": "4",
      "cinco": "5",
      "seis": "6",
      "sete": "7",
      "oito": "8",
      "nove": "9",
      "dez": "10"
    };

    if (mapaNumeros[numero]) {
      numero = mapaNumeros[numero];
    }

    if (!numero) {
      return handlerInput.responseBuilder
        .speak('Não entendi o número. Diga, por exemplo: pergunta 1.')
        .reprompt('Diga o número da pergunta.')
        .getResponse();
    }

    const item = catecismo[numero];

    if (!item) {
      return handlerInput.responseBuilder
        .speak(`Não encontrei a pergunta ${numero}.`)
        .reprompt('Tente outro número.')
        .getResponse();
    }

    const resposta =
      item.resposta_ssml ||
      item.resposta_alexa ||
      item.resposta_fiel ||
      'Resposta não disponível.';

    return handlerInput.responseBuilder
      .speak(resposta)
      .withSimpleCard(`Pergunta ${numero}`, item.resposta_alexa || item.resposta_fiel || '')
      .getResponse();
  }
};

// Ajuda
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Você pode dizer: pergunta 1, pergunta 2, e assim por diante.')
      .reprompt('Diga um número de pergunta.')
      .getResponse();
  }
};

// Cancelar / sair
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
      || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Até logo!')
      .getResponse();
  }
};

// Fallback
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Não entendi. Tente dizer: pergunta 1.')
      .reprompt('Diga o número da pergunta.')
      .getResponse();
  }
};

// Erros
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('Erro capturado:', error);

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
    CancelAndStopIntentHandler,
    FallbackIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

// ================= ENDPOINT =================

app.post('/', async (req, res) => {
  try {
    const response = await skill.invoke(req.body);
    res.json(response);
  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).send('Erro no servidor');
  }
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});