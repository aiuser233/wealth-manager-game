import { expect, test } from '@playwright/test';

test('新游戏、核心导航、存档刷新与继续游戏', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '重生之我是理财经理' })).toBeVisible();
  await page.getByRole('button', { name: /入职报到/ }).click();

  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '知道了' }).click();
  await page.getByRole('button', { name: '开始营业' }).click();
  await expect(page.getByText('当前目标')).toBeVisible();
  await expect(page.getByRole('banner').getByText('2006-01-02')).toBeVisible();

  await page.getByRole('banner').getByRole('button', { name: '行情', exact: true }).click();
  await expect(page.getByRole('heading', { name: /行情终端/ })).toBeVisible();

  await page.getByRole('banner').getByText('更多', { exact: false }).click();
  await page.getByRole('button', { name: '存档与报告' }).click();
  await page.getByRole('button', { name: '保存到手动档 1' }).click();
  await expect(page.getByText('已保存到手动档 1')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /继续上次进度/ })).toBeVisible();
  await page.getByRole('button', { name: /继续上次进度/ }).click();
  await expect(page.getByRole('banner').getByText('2006-01-02')).toBeVisible();
});
