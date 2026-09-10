import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// Resolve a dependência usada pelo Kit, não outra cópia hoisted no template.
const requireFromKit = createRequire(import.meta.resolve('@sveltejs/kit/package.json'));
const cookie: typeof import('cookie') = requireFromKit('cookie');

describe('contrato de cookies do SvelteKit — GHSA-pxg6-pf52-xh8x', () => {
  it('rejeita injeção de atributos pelo nome', () => {
    expect(() => cookie.serialize('session=outro; Max-Age=999; extra', 'valor')).toThrow();
  });

  it.each([
    { path: '/; SameSite=None' },
    { domain: 'example.test; SameSite=None' },
  ])('rejeita injeção de atributos em %j', (options) => {
    expect(() => cookie.serialize('session', 'valor', options)).toThrow();
  });

  it('preserva serialização de sessão, flags e domínio com ponto inicial', () => {
    expect(
      cookie.serialize('__Secure-session', 'valor com espaço', {
        path: '/',
        domain: '.example.test',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 900,
      }),
    ).toBe(
      '__Secure-session=valor%20com%20espa%C3%A7o; Max-Age=900; Domain=.example.test; Path=/; HttpOnly; Secure; SameSite=Lax',
    );
  });

  it('preserva exclusão por maxAge zero e valor vazio', () => {
    expect(cookie.serialize('session', '', { path: '/', maxAge: 0 })).toBe(
      'session=; Max-Age=0; Path=/',
    );
  });

  it('preserva leitura, primeiro valor duplicado e percent-encoding inválido', () => {
    expect(cookie.parse('session=primeiro; session=segundo; label=a%20b; broken=%ZZ')).toEqual({
      session: 'primeiro',
      label: 'a b',
      broken: '%ZZ',
    });
  });

  it('preserva decode e encode customizados usados pelo Kit', () => {
    expect(cookie.parse('session=a%20b', { decode: (value) => value })).toEqual({
      session: 'a%20b',
    });
    expect(cookie.serialize('session', 'a%20b', { encode: (value) => value })).toBe('session=a%20b');
  });
});
