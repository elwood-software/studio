export async function wait(time = 1000) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
}
