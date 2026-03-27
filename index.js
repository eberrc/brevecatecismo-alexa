const express = require('express');
const Alexa = require('ask-sdk-core');
const catecismo = require('./brevecatecismo.json');

const app = express();
app.use(express.json());

// ================= DEBUG HANDLER (CAPTURA TUDO) =================

const DebugIntentHandler = {
  canHandle(handlerInput) {
    return true; // 🔥 aceita QUALQUER requisição
  },
  handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;

    console.log("REQUEST COMPLETA:", JSON.stringify(request, null, 2));

    let numero = request.intent?.slots?.numero?.value;

    console.log("Número recebido:", numero);

    if (!numero) {
      return handlerInput.responseBuilder
        .speak('Recebi sua solicitação, mas não entendi o número.')
        .getResponse();
    }

    const item = catecismo[numero];

    if (!item) {
      return handlerInput.responseBuilder
        .speak(`Não encontrei a pergunta ${numero}.`)
        .getResponse();
    }

    const resposta =
      item.resposta_ssml ||
      item.resposta_alexa ||
      item.resposta_fiel ||
      'Sem resposta disponível.';

    return handlerInput.responseBuilder
      .speak(resposta)
      .getResponse();
  }
};

// ================= SKILL =================

const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(DebugIntentHandler) // 🔥 só ele
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