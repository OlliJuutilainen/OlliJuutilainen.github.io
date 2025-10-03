# Smoke test secrets

GitHub Actionsin `Smoke`-workflow tarvitsee seuraavat salaisuudet repo- tai organisaatiotasoilla:

| Secret | Kuvaus |
| ------ | ------- |
| `ORIGIN_URL` | Julkaistun sivun juuri-URL (esim. `https://ollijuutilainen.github.io`). |
| `WORKER_URL` | Cloudflare Worker, josta `/api/loc` haetaan (esim. `https://tusinasaa-worker.ollijuutilainen.workers.dev`). |
| `TEST_T` | KV-namespacen `LOCATIONS` sisällä oleva tunniste (token) `t`-avaimelle. |
| `TEST_K` | Samaiseen pakettiin kuuluva base64url-koodattu `key`. |

Varmista, että `TEST_T` ja `TEST_K` osoittavat samaan kv-pakettiin, jonka arvo on JSON-objekti, jossa on kentät `iv` ja `ct`.
