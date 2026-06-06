# Feed TikTok Estatico

Site estatico para publicar no GitHub Pages.

## Como adicionar fotos e videos no GitHub

1. Abra o repositorio no GitHub.
2. Entre na pasta `media`.
3. Clique em `Add file > Upload files`.
4. Envie suas imagens ou videos.
5. Clique em `Commit changes`.

Pronto. O site lista sozinho os arquivos da pasta `media`.

## Formatos recomendados

- Imagens: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`
- Videos: `.mp4`, `.webm`, `.mov`, `.m4v`
- Tamanho recomendado: `720x1280` na vertical

## Opcional: legendas manuais

Por padrao, a legenda e gerada a partir do nome do arquivo. Se quiser controlar manualmente as legendas, edite `media.js`:

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
