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
  addRepo(repo: Repo): Promise<any>
  deleteRepo(repo: Repo): Promise<any>
  modifyRepo(repo: Repo): Promise<any>
}

export { Repo, Backend };
