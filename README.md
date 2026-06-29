# Feed TikTok Estatico

Site estatico para publicar no GitHub Pages.

## Como adicionar fotos e videos no GitHub

### Pelo painel de envio

1. Abra `admin.html` no site publicado.
2. Cole um token do GitHub com permissao de escrita no repositorio `recibodigitalapp-pixel/mf`.
3. Escolha se quer enviar para o feed principal ou para banners.
4. Selecione as imagens ou videos.
5. Clique em `Enviar para o GitHub`.

Quem nao tiver o token nao consegue publicar arquivos.
As midias novas aparecem primeiro no feed.

### Pelo GitHub

1. Abra o repositorio no GitHub.
2. Entre na pasta `media`.
3. Clique em `Add file > Upload files`.
4. Envie suas imagens ou videos.
5. Clique em `Commit changes`.

Pronto. O site lista sozinho os arquivos da pasta `media`.
Os arquivos mais novos aparecem primeiro no feed.

## Como adicionar banners

1. Entre na pasta `ads`.
2. Clique em `Add file > Upload files`.
3. Envie banners em imagem ou video.
4. Clique em `Commit changes`.

O site coloca automaticamente 1 banner a cada 3 postagens.
Use banners verticais no tamanho recomendado `720x1280`.

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
