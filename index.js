const Alexa = require('ask-sdk-core');
const fs = require('fs');

// ================= CARREGAR JSON =================

let catecismo = {};

try {
  const data = fs.readFileSync('./brevecatecismo.json', 'utf8');
  catecismo = JSON.parse(data);
  console.log("✅ JSON carregado com sucesso");
} catch (err) {
  console.log("❌ Erro ao carregar JSON:", err);
}

// ================= FUNÇÕES =================

// 🔥 TESTE FORÇADO
function falarResposta(numero, item) {
  return `<speak>TESTE FUNCIONANDO PERFEITO</speak>`;
}

function getSession(handlerInput) {
  return handlerInput.attributesManager.getSessionAttributes();
}

// ================= HANDLERS =================

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Bem-vindo ao Breve Catecismo. Diga: pergunta 10.")
      .reprompt("Diga: pergunta 10.")
      .getResponse();
  }
};

const PerguntaNumeroIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PerguntaNumeroIntent';
  },
  handle(handlerInput) {
    try {
      const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value;

      console.log("📥 Número recebido:", numero);

      const item = catecismo[numero] || {};

      const fala = falarResposta(numero, item);

      return handlerInput.responseBuilder
        .speak(fala)
        .reprompt("Quer outra pergunta?")
        .getResponse();

    } catch (error) {
      console.log("❌ Erro:", error);
      return handlerInput.responseBuilder
        .speak("Erro no teste.")
        .getResponse();
    }
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("❌ Erro capturado:", error);
    return handlerInput.responseBuilder
      .speak("Erro geral.")
      .getResponse();
  }
};

// ================= EXPORT =================

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PerguntaNumeroIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();