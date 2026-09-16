export const getUserApplicationNumber = (applications, appId) => {
  if (!Array.isArray(applications) || appId === null || appId === undefined || appId === "") {
    return null;
  }

  const ordered = [...applications].sort(
    (a, b) => Number(a.id) - Number(b.id),
  );

  const index = ordered.findIndex(
    (application) => Number(application.id) === Number(appId),
  );

  return index >= 0 ? index + 1 : null;
};
