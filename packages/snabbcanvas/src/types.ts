export enum CommandType {
  FIELD = 'field',
  FUNCTION = 'function'
};

export type FieldCommand = {
  type: CommandType.FIELD;
  name: string;
  value: any;
}

export type FunctionCommand = {
  type: CommandType.FUNCTION;
  name: string;
  args: string[];
}

export type Command = FieldCommand | FunctionCommand;
