interface Ask {
  [str: string]: any;
  cmd: string;
}

interface Answer {
  [str: string]: any;
  cmd: Command;
  errCode: number;
}

enum Command {
  KeepAlive = "KEEP ALIVE",
  GetAdapters = "GET ADAPTERS",
  GetStatus = "GET STATUS",
  Modify = "MODIFY"
}

export { Ask, Answer, Command };