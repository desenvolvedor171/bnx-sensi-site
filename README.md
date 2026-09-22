# BNX SENSI — Site de vendas

## Como abrir
1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Abra `index.html` no navegador.

## Arquivos
- `index.html` — estrutura da loja
- `style.css` — visual preto/roxo e responsividade
- `script.js` — carrinho

## Checkout
- QR Code Pix gerado na hora com o valor exato da compra (BR Code com CRC válido).
- Na tela de pagamento aparece só o nome do recebedor + Pix Copia e Cola.
- Após clicar em "Já fiz o pagamento", abre o chat da loja com o vendedor.

## Chat
- Backend em `../BNX-Chat` (repo `bnx-chat-server`): conversas + mensagens + painel do vendedor.
- Painel do vendedor: `/chat-admin.html` no backend (login `vendedor`).

O link do Discord já está configurado para:
https://discord.gg/bnxsensi


## Pix configurado
- Chave: 70209387602
- Recebedor: LUENDERSON BERNARDO ROBERTO BARBOSA
- Cidade: URUCANIA
- QR Code: `assets/pix-bnx-sensi.png`

**Importante:** este QR Code é um Pix estático, sem valor fixado e sem confirmação automática. O cliente ainda precisa enviar o pagamento e a loja não verifica sozinha se o Pix caiu. Para confirmação automática e liberação automática do produto, será necessário integrar um gateway/API de pagamento.
