interface IError<MsgType extends string> {
  msg: MsgType;
  err?: unknown;
}

function errorFrom<MsgType extends string>(
  msg: MsgType,
  err: unknown = ''
): IError<MsgType> {
  return {
    msg,
    err,
  };
}

export { type IError, errorFrom };
