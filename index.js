const express = require('express');
const Alexa = require('ask-sdk-core');
const fs = require('fs');
const path = require('path');

// ================= JSON (CORRETO 100%) =================

// Caminho absoluto do arquivo
const filePath = path.join(__dirname, 'brevecatecismo.json');

// Ler arquivo SEM cache
const catecismo = JSON.parse(
  fs.readFileSync(filePath, 'utf8')
);

// 🔍 LOGS DE GARANTIA
console.log("📂 Caminho do JSON:", filePath);
console.log("📂 Arquivos na pasta:", fs.readdirSync(__dirname));
console.log("✅ Total de perguntas:", Object.keys(catecismo).length);
console.log("🔎 TESTE PERGUNTA 10:", catecismo["10"]);

// ================= SERVIDOR =================

const app = express();
app.use(express.json());

// ================= FUNÇÕES =================

function falarResposta(numero, item) {
  return item.resposta_ssml || `<speak>
    Pergunta ${numero}.
    <break time="400ms"/>
    ${item.resposta_alexa}
  </speak>`;
}

function getSession(handlerInput) {
  return handlerInput.attributesManager.getSessionAttributes();
}

// ================= HANDLERS =================

// Abertura
const LaunchRequestHandler = {
  canHandle(h) {
    return Alexa.getRequestType(h.requestEnvelope) === 'LaunchRequest';
  },
  handle(h) {
    return h.responseBuilder
      .speak(`<speak>
        Bem-vindo ao catecismo.
        <break time="400ms"/>
        Você pode dizer:
        pergunta 1,
        próxima pergunta,
        pergunta aleatória,
        ou iniciar quiz.
      </speak>`)
      .reprompt('Diga um comando.')
      .getResponse();
  }
};

// Pergunta por número
const PerguntaNumeroIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'PerguntaNumeroIntent';
  },
  handle(h) {
    const session = getSession(h);

    const numero = h.requestEnvelope.request.intent.slots?.numero?.value;

    if (!numero || !catecismo[numero]) {
      return h.responseBuilder
        .speak('Não entendi o número.')
        .reprompt('Diga: pergunta 1.')
        .getResponse();
    }

    session.ultima = parseInt(numero);

    return h.responseBuilder
      .speak(falarResposta(numero, catecismo[numero]))
      .getResponse();
  }
};

// Próxima pergunta
const ProximaPerguntaIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'ProximaPerguntaIntent';
  },
  handle(h) {
    const session = getSession(h);

    let numero = (session.ultima || 0) + 1;

    if (!catecismo[numero]) {
      numero = 1;
    }

    session.ultima = numero;

    return h.responseBuilder
      .speak(falarResposta(numero, catecismo[numero]))
      .getResponse();
  }
};

// Pergunta aleatória
const PerguntaAleatoriaIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'PerguntaAleatoriaIntent';
  },
  handle(h) {
    const session = getSession(h);

    const numero = Math.floor(Math.random() * 107) + 1;
    session.ultima = numero;

    return h.responseBuilder
      .speak(falarResposta(numero, catecismo[numero]))
      .getResponse();
  }
};

// Devocional
const DevocionalIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'DevocionalIntent';
  },
  handle(h) {
    const hoje = new Date().getDate();
    const numero = (hoje % 107) + 1;

    return h.responseBuilder
      .speak(`<speak>
        Devocional de hoje.
        <break time="400ms"/>
        ${falarResposta(numero, catecismo[numero])}
      </speak>`)
      .getResponse();
  }
};

// Quiz iniciar
const IniciarQuizIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'IniciarQuizIntent';
  },
  handle(h) {
    const session = getSession(h);

    const numero = Math.floor(Math.random() * 107) + 1;
    session.quiz = numero;

    return h.responseBuilder
      .speak(`<speak>
        Pergunta ${numero}.
        <break time="400ms"/>
        ${catecismo[numero].pergunta}
      </speak>`)
      .reprompt('Qual é a resposta?')
      .getResponse();
  }
};

// Quiz resposta
const RespostaQuizIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'RespostaQuizIntent';
  },
  handle(h) {
    const session = getSession(h);

    if (!session.quiz) {
      return h.responseBuilder
        .speak('Você precisa iniciar um quiz primeiro.')
        .getResponse();
    }

    const numero = session.quiz;
    const correta = catecismo[numero].resposta_alexa;

    session.quiz = null;

    return h.responseBuilder
      .speak(`<speak>
        Boa tentativa.
        <break time="300ms"/>
        A resposta correta é:
        <break time="300ms"/>
        ${correta}
      </speak>`)
      .getResponse();
  }
};

// Ajuda
const HelpIntentHandler = {
  canHandle(h) {
    return Alexa.getIntentName(h.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(h) {
    return h.responseBuilder
      .speak('Você pode pedir uma pergunta, iniciar quiz ou ouvir o devocional.')
      .reprompt('O que deseja?')
      .getResponse();
  }
};

// Cancelar / Sair
const CancelHandler = {
  canHandle(h) {
    return ['AMAZON.StopIntent','AMAZON.CancelIntent'].includes(
      Alexa.getIntentName(h.requestEnvelope)
    );
  },
  handle(h) {
    return h.responseBuilder
      .speak('Até logo!')
      .getResponse();
  }
};

// Erro global
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(h, err) {
    console.log("❌ ERRO:", err);
    return h.responseBuilder
      .speak('Ocorreu um erro.')
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
    DevocionalIntentHandler,
    IniciarQuizIntentHandler,
    RespostaQuizIntentHandler,
    HelpIntentHandler,
    CancelHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

// ================= SERVER =================

app.post('/', async (req, res) => {
  const response = await skill.invoke(req.body);
  res.json(response);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🚀 Servidor rodando na porta ' + PORT);
});