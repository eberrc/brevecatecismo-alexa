const express = require('express');
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');

const app = express();

// Skill simples
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers({
    canHandle() { return true; },
    handle(handlerInput) {
      return handlerInput.responseBuilder
        .speak('Funcionando!')
        .getResponse();
    }
  })
  .create();

// Adapter correto
const adapter = new ExpressAdapter(skill, true, true);

// Endpoint correto (AQUI estava o erro)
app.post('/', adapter.getRequestHandlers());

// Porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor rodando...');
});