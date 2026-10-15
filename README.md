# React + TypeScript + Vite

## 단일 사이트 운영

이 프로젝트는 `https://www.naranfintech.com` 전용으로 배포합니다. 다른 홈페이지는 별도 서버/프로젝트에서 운영하며, 이 코드에서는 요청 도메인에 따른 사이트 선택이나 게시글 자동 변환을 하지 않습니다.

- 프런트엔드와 서버의 대표 주소는 `shared/site.js`의 `SITE_BASE_URL`을 사용합니다. 초기 HTML, 게시글 SEO, RSS, 사이트맵도 같은 주소를 사용합니다.
- 관리자에서 입력한 업체명과 설명을 게시판·상세·RSS에 그대로 표시합니다. Firestore 저장 구조는 그대로 사용합니다.
- `VITE_SITE_ID`, `SITE_URL`, `VITE_SITE_URL`을 통한 사이트 선택은 더 이상 사용하지 않습니다.

## 최신 게시글 RSS

`/rss.xml`은 `api/rss.js`에서 Firestore의 최근 게시글 최대 500개를 작성일 내림차순으로 읽어 생성합니다. 제목, 상세 URL, 전체 본문, 원래 발행일을 제공하며 `lastBuildDate`는 포함된 글의 최신 작성·수정 시각을 사용합니다. 상세 페이지와 같은 제목·본문·주소를 적용합니다.

- `검색차단` 글은 외부 상세 페이지가 공개되어 있으므로 RSS에 포함합니다. `전화연결` 글과 필수 내용·발행일이 없는 글은 제외합니다.
- 기존 사이트맵과 같은 `FIREBASE_SERVICE_ACCOUNT_JSON` 또는 `GOOGLE_SERVICE_ACCOUNT_JSON` 환경변수를 사용합니다. DB를 수정하지 않습니다.
- 배포 후 새 글은 재배포 없이 반영되며 서버 캐시는 5분입니다. DB 조회 실패 시 빈 피드 대신 캐시하지 않는 HTTP 503을 반환합니다.
- `public/rss.xml`은 동적 경로를 가리지 않도록 제거했습니다. Vite 개발 서버/정적 preview에는 서버 API가 없으므로 실제 RSS 경로는 Vercel에서 확인합니다.
- 검증: `npm run build`, `npm run lint`, `npm run verify:seo`.

## 홈페이지와 변호사 소개의 초기 HTML

`npm run build`는 실제 `App` 컴포넌트로 홈페이지(`/`)와 변호사 소개(`/lawyers`)를 미리 렌더링합니다. 제목, 사건 유형, 변호사 경력, FAQ, 내부 링크가 JavaScript 실행 전의 HTML에도 포함됩니다. 문구와 화면은 `src/App.tsx`에서 함께 관리하며, 변경 후 다시 빌드하면 초기 HTML도 갱신됩니다.

- `dist/prerender/{home,lawyers}.html`: 현재 사이트의 초기 HTML.
- `api/site-page.js`: 홈페이지와 변호사 소개의 초기 HTML 제공. Vercel의 `/`, `/lawyers` rewrite와 `includeFiles` 설정을 함께 배포해야 합니다.
- `dist/index.html`, `dist/lawyers.html`: 같은 페이지의 정적 결과물.
- `dist/app-shell.html`: 기존 업체 목록·상세 렌더러가 사용하는 빈 템플릿. 홈페이지 본문이 업체 상세에 섞이지 않도록 별도로 유지합니다.
- 브라우저가 로드되면 기존 React 앱이 상호작용을 담당합니다. 초기 HTML의 본문은 JavaScript가 없어도 표시되며, 공개 페이지 사전 렌더링에는 Firebase 접속이 필요하지 않습니다.
- 검증: `npm run build`, `npm run lint`, `npm run verify:seo`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Naver Powerlink Landing URLs

The app now supports keyword-specific landing URLs with encrypted tokens while keeping the same home screen UI.

- Recommended landing path format: `/p/{encryptedToken}`
- Set custom prefix in frontend if needed: `VITE_POWERLINK_PATH_PREFIX`
- Admin page can generate encrypted URLs directly (`/api/powerlink/generate`)
- On form submit, the following are sent to API and saved:
  - `landingPath`
  - `landingToken`
  - `landingKeyword` (decoded server-side when `POWERLINK_URL_SECRET` is set)

Generate encrypted landing URLs:

```bash
npm run powerlink:url -- "코인 사기 변호사" "https://your-domain.vercel.app"
```

## Quick Consultation Flow (Vercel API)

This project includes `api/consultation.js` for quick consultation submissions.

Flow:

1. Frontend form submits to `/api/consultation`.
2. Vercel API stores the request in Firestore (`consultationRequests`).
3. Vercel API appends a row to Google Sheets.
4. Vercel API sends a Telegram bot alert.

Required Vercel environment variables are listed in `.env.vercel.example`.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
