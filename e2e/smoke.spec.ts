// Every route renders, no console errors, no failed requests, no serious a11y
// violations, and a full-page screenshot is saved as evidence.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/presidente", "/governador", "/senador", "/deputado-federal", "/deputado-estadual", "/meus-candidatos", "/como-funciona"];

for (const route of routes) {
  test(`smoke ${route}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) => {
      // Na versão estática o Next sonda cada link com um HEAD e cancela ao receber a resposta.
      if (r.method() === "HEAD" && r.failure()?.errorText === "net::ERR_ABORTED") return;
      errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`);
    });

    const res = await page.goto(route);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);

    const name = route === "/" ? "home" : route.replaceAll("/", "");
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}-${name}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("a página não rola para o lado no celular", async ({ page }) => {
  await page.goto("/deputado-federal");
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobra).toBeLessThanOrEqual(0);
});

test("a lista de presidente começa na direita e termina na esquerda", async ({ page }) => {
  await page.goto("/presidente");
  const faixas = await page.locator("tbody th").allTextContents();
  expect(faixas[0]).toContain("Bem à direita");
  expect(faixas.at(-1)).toContain("Bem à esquerda");
});

test("buscar um deputado federal pelo número e filtrar só os vermelhos", async ({ page }) => {
  await page.goto("/deputado-federal");
  const linhas = page.locator("tbody tr[data-alerta]");
  await expect(linhas).toHaveCount(50);

  await page.getByRole("searchbox").fill("5000");
  await expect(linhas).toHaveCount(1);
  await expect(linhas.first()).toContainText("SÂMIA BOMFIM");

  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: /Só em vermelho/ }).click();
  await expect(linhas.first()).toHaveAttribute("data-alerta", "true");
  await expect(page.locator('tbody tr[data-alerta="false"]')).toHaveCount(0);
  await expect(linhas.first().getByRole("link", { name: /Fonte:/ }).first()).toBeVisible();
});

test("do início dá para chegar em cada cargo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Governador de São Paulo/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Governador de São Paulo");
  await page.getByRole("link", { name: /Senador/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Senador por São Paulo");
});

test("favoritar um candidato por cargo aparece em Meus candidatos e sobrevive ao recarregar", async ({ page }) => {
  await page.goto("/presidente");
  const botoes = page.getByRole("button", { name: /Favoritar/ });
  await botoes.nth(0).click();
  await botoes.nth(0).click(); // o 2º favoritar vira o 1º botão ainda desmarcado
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(1);

  await page.goto("/governador");
  await page.getByRole("button", { name: /Favoritar/ }).first().click();

  await page.getByRole("link", { name: /Meus candidatos/ }).first().click();
  await expect(page.getByText("2 de 6 votos escolhidos, faltam 4.")).toBeVisible();
  await expect(page.locator('[data-cargo="presidente"][data-escolhido="true"]')).toBeVisible();
  await expect(page.locator('[data-cargo="senador"][data-completo="false"]')).toBeVisible();

  await page.getByRole("heading", { name: /Senador por São Paulo/ }).getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Senador por São Paulo");
  await page.goBack();

  await page.reload();
  await expect(page.getByText("2 de 6 votos escolhidos, faltam 4.")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/meus-candidatos-favoritos.png", fullPage: true });
});
