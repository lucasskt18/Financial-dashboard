# Diário

Programa de mesa para organizar o dinheiro do dia a dia. Abre na própria janela e grava os lançamentos neste computador.

## Como os números funcionam

- **Custo do dia** é a soma dos débitos daquela data. A linha da planilha muda no momento em que um débito é lançado, editado ou excluído. Dia sem débito fica em zero.
- **Teto do dia** divide o que sobra do mês pelos dias. O que sobra são as entradas, menos o que foi para economia e investimentos, mais os resgates.
- **Folga** é o teto menos o custo. O acumulado soma essa folga do dia 1 até hoje.
- Economia e investimentos não entram no custo. Eles só mudam o teto.

## Uso

```bash
npm install
npm test
npm run tauri dev
```

O arquivo fica em `ledger.json`, na pasta de dados do aplicativo. No Linux, o caminho usual é `~/.local/share/com.lucasamancio.diario/ledger.json`.

As seções são Planilha, Hoje, Saídas, Entradas, Economia e Investimentos.
