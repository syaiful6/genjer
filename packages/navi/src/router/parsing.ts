function getPath(url: string): string {
  const queryIx = url.indexOf('?');
  const pathEnd = queryIx < 0 ? url.length : queryIx;
  let path = url.slice(0, pathEnd).replace(/\/{2,}/g, "/");
  if (!path) return path;

  if (path[0] !== '/') path = '/' + path;
  if (path.length > 1 && path[path.length - 1] === '/') path = path.slice(0, -1);

  return path;
}

type Key = {
  k: string;
  r: boolean;
}

export interface Matcher {
  (path: string): [boolean, any];
}

export function compileTemplate<T = any>(template: string): Matcher {
  const tplPath = getPath(template);
  let keys: Key[] = [];
  const regexp = new RegExp('^'+ tplPath.replace(
    /:([^\/.-]+)(\.{3}|\.(?!\.)|-)?|[\\^$*+.()|\[\]{}]/g,
    (m, key, extra) => {
      if (key == null) return "\\" + m;
      keys.push({k: key, r: extra === "..."});
      if (extra === "...") return "(.*)";
      if (extra === ".") return "([^/]+)\\.";
      return "([^/]+)" + (extra || "");
    }
  ) + '$');
  return (path: string) => {
    path = getPath(path);
    if (!keys.length) return [regexp.test(path), {}];

    const values = regexp.exec(path);
    if (!values) return [false, {}];
    let params: any = {};
    for (let i = 0, len = keys.length; i < len; i++) {
      params[keys[i].k] = keys[i].r ? values[i + 1] : decodeURIComponent(values[i + 1]);
    }

    return [true, params] as [boolean, any];
  };
}
