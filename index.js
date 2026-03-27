const express = require('express');
const Alexa = require('ask-sdk-core');
const catecismo = require('./brevecatecismo.json');

const app = express();
app.use(express.json());

// ================= ESTADO SIMPLES =================
let ultimaPergunta = 1;
let perguntaQuiz = null;

// ================= FUNÇÃO AUXILIAR =================
function montarResposta(numero, item) {
  const texto =
    item.resposta_ssml ||
    `<speak>
      <p>Pergunta ${numero}.</p>
      <break time="400ms"/>
      <p>${item.resposta_alexa || item.resposta_fiel}</p>
    </speak>`;

  return texto;
}

// ================= HANDLERS =================

// Abertura da skill
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('<speak>Bem-vindo ao catecismo. Diga: pergunta 1.</speak>')
      .reprompt('Diga o número de uma pergunta.')
      .getResponse();
  }
};

// Pergunta por número
const PerguntaNumeroIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'PerguntaNumeroIntent';
  },
  handle(handlerInput) {

    let numero = handlerInput.requestEnvelope.request.intent.slots?.numero?.value;

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
        .speak('Não entendi o número. Diga: pergunta 1.')
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

    ultimaPergunta = parseInt(numero);

    return handlerInput.responseBuilder
      .speak(montarResposta(numero, item))
      .getResponse();
  }
};

// Próxima pergunta
const ProximaPerguntaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'ProximaPerguntaIntent';
  },
  handle(handlerInput) {

    ultimaPergunta++;

    const item = catecismo[ultimaPergunta];

    if (!item) {
      ultimaPergunta = 1;
      return handlerInput.responseBuilder
        .speak('<speak>Chegamos ao final. Voltando para a pergunta 1.</speak>')
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(montarResposta(ultimaPergunta, item))
      .getResponse();
  }
};

// Pergunta aleatória
const PerguntaAleatoriaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'PerguntaAleatoriaIntent';
  },
  handle(handlerInput) {

    const numero = Math.floor(Math.random() * 107) + 1;
    const item = catecismo[numero];

    ultimaPergunta = numero;

    return handlerInput.responseBuilder
      .speak(montarResposta(numero, item))
      .getResponse();
  }
};

// Iniciar quiz
const IniciarQuizIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'IniciarQuizIntent';
  },
  handle(handlerInput) {

    const numero = Math.floor(Math.random() * 107) + 1;
    perguntaQuiz = numero;

    return handlerInput.responseBuilder
      .speak(`<speak>Pergunta ${numero}. <break time="400ms"/> ${catecismo[numero].pergunta}</speak>`)
      .reprompt('Qual é a resposta?')
      .getResponse();
  }
};

// Responder quiz
const RespostaQuizIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'RespostaQuizIntent';
  },
  handle(handlerInput) {

    if (!perguntaQuiz) {
      return handlerInput.responseBuilder
        .speak('Você ainda não iniciou um quiz.')
        .getResponse();
    }

    const item = catecismo[perguntaQuiz];

    return handlerInput.responseBuilder
      .speak(`<speak>Resposta correta. <break time="400ms"/> ${item.resposta_alexa}</speak>`)
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
      .speak('Diga: pergunta 1, próxima pergunta, ou iniciar quiz.')
      .reprompt('Como posso ajudar?')
      .getResponse();
  }
};

// Cancelar / sair
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
      || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent';
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
      .reprompt('Tente novamente.')
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
    ProximaPerguntaIntentHandler,
    PerguntaAleatoriaIntentHandler,
    IniciarQuizIntentHandler,
    RespostaQuizIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

// ================= SERVIDOR =================

app.post('/', async (req, res) => {
  try {
    const response = await skill.invoke(req.body);
    res.json(response);
  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).send('Erro no servidor');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});