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

function falarResposta(numero, item) {
  // 🔥 TESTE: forçando falar a PERGUNTA
  return `<speak>${item.pergunta}</speak>`;
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
    const speakOutput = "Bem-vindo ao Breve Catecismo. Você pode pedir um número de pergunta.";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("Diga, por exemplo: pergunta 10.")
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

      const item = catecismo[numero];

      if (!item) {
        return handlerInput.responseBuilder
          .speak("Não encontrei essa pergunta.")
          .reprompt("Tente outro número.")
          .getResponse();
      }

      const fala = falarResposta(numero, item);

      return handlerInput.responseBuilder
        .speak(fala)
        .reprompt("Deseja outra pergunta?")
        .getResponse();

    } catch (error) {
      console.log("❌ Erro:", error);
      return handlerInput.responseBuilder
        .speak("Desculpe, ocorreu um erro.")
        .getResponse();
    }
  }
};

const ProximaPerguntaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ProximaPerguntaIntent';
  },
  handle(handlerInput) {
    const session = getSession(handlerInput);
    let atual = session.numeroAtual || 1;
    atual++;

    if (!catecismo[atual]) atual = 1;

    session.numeroAtual = atual;
    handlerInput.attributesManager.setSessionAttributes(session);

    const item = catecismo[atual];
    const fala = falarResposta(atual, item);

    return handlerInput.responseBuilder
      .speak(fala)
      .reprompt("Deseja continuar?")
      .getResponse();
  }
};

const PerguntaAleatoriaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PerguntaAleatoriaIntent';
  },
  handle(handlerInput) {
    const numeros = Object.keys(catecismo);
    const aleatorio = numeros[Math.floor(Math.random() * numeros.length)];

    const item = catecismo[aleatorio];
    const fala = falarResposta(aleatorio, item);

    return handlerInput.responseBuilder
      .speak(fala)
      .reprompt("Deseja outra?")
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Você pode dizer: pergunta 10, próxima pergunta ou pergunta aleatória.")
      .reprompt("Como posso ajudar?")
      .getResponse();
  }
};

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
      .speak("Até logo!")
      .getResponse();
  }
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Não entendi. Tente dizer: pergunta 10.")
      .reprompt("Tente novamente.")
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("❌ Erro capturado:", error);
    return handlerInput.responseBuilder
      .speak("Desculpe, ocorreu um erro.")
      .getResponse();
  }
};

// ================= EXPORT =================

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PerguntaNumeroIntentHandler,
    ProximaPerguntaIntentHandler,
    PerguntaAleatoriaIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();