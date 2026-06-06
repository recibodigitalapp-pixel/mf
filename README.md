# Feed TikTok Estatico

Site estatico para publicar no GitHub Pages. Ele nao tem backend, upload ou painel admin: voce coloca os arquivos na pasta `media/` e lista cada item em `media.js`.

## Como adicionar fotos e videos

1. Copie suas imagens e videos para a pasta `media/`.
2. Abra `media.js`.
3. Adicione cada arquivo dentro de `window.FEED_ITEMS`.

Exemplo:

```js
window.FEED_ITEMS = [
  {
    src: "media/foto-1.jpg",
    caption: "Minha primeira foto",
    author: "@meu-perfil"
  },
  {
    src: "media/video-1.mp4",
    caption: "Meu primeiro video",
    author: "@meu-perfil",
    type: "video"
  }
];
```

Formatos recomendados:

- Imagens: `.jpg`, `.jpeg`, `.png`, `.webp`
- Videos: `.mp4`, `.webm`

## Ver no computador

Abra o arquivo `index.html` no navegador.

## Publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie todos os arquivos desta pasta para o repositorio.
3. No GitHub, entre em `Settings > Pages`.
4. Em `Build and deployment`, escolha `Deploy from a branch`.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve e aguarde o link do Pages.

Se o repositorio se chamar `fotos`, o link fica parecido com:

```text
https://seu-usuario.github.io/fotos/
```
