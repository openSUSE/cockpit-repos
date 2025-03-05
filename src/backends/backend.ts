// enum RepoType {
//   ftp,
//   http,
//   https,
//   smb_cifs,
//   nfs,
//   cd,
//   dvd,
//   hard_disk,
//   usb,
//   local_directory,
//   local_iso_image,
// }

import { Spawn } from "cockpit";

type Repo = {
  index: number,
  alias: string,
  name: string,
  // type: RepoType,
  priority: number,
  enabled: boolean,
  autorefresh: boolean,
  gpgcheck: boolean,
  uri: string,
}

interface Backend {
  getRepos(): Promise<Repo[]>,
  addRepo(repo: Repo): Promise<string>
  deleteRepo(repo: Repo): Promise<string>
  modifyRepo(repo: Repo): Promise<string>
  refreshRepo(repo: Repo | null, importKeys?: boolean): Spawn<string>
}

export { Repo, Backend };
