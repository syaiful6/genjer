import {LocationDescriptorObject} from 'history';

export type Pathname    = string;
export type Search      = string;
export type Hash        = string;
export type LocationKey = string;

export type PushAction = {
  type: 'push';
} & LocationDescriptorObject;

export type ReplaceAction = {
  type: 'replace';
  pathname: Pathname;
  state?: any;
}

export type GoAction = {
  type: 'go';
  amount: number;
}

export type BackAction = {
  type: 'goback';
}

export type ForwardAction = {
  type: 'forward';
}

export type HistoryAction
  = PushAction
  | ReplaceAction
  | GoAction
  | BackAction
  | ForwardAction;
