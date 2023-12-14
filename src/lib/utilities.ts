export const postRequest = async (url: string, data: any) => {
  const post = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    cache: "default",
  });
  const jsonRes = await post.json();
  if (post.status === 200) {
    return jsonRes;
  } else {
    return { status: post.status, message: jsonRes.message };
  }
};
