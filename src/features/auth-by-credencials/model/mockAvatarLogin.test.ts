import { loginWithMockCredencials, getAuthenticatedUserMock } from './mockAuthService';

test('avatar demo account requires its password and restores the same student', async () => {
  await expect(loginWithMockCredencials('avatar@anatoquizup.local', 'wrong')).rejects.toThrow();
  const tokens = await loginWithMockCredencials('avatar@anatoquizup.local', 'Avatar2026!');
  localStorage.setItem('access_token', tokens.accessToken);
  expect(await getAuthenticatedUserMock()).toMatchObject({
    id: 'avatar-demo-local',
    role: 'STUDENT',
    email: 'avatar@anatoquizup.local',
  });
  localStorage.removeItem('access_token');
});
