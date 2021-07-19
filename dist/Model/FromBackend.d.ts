import { Model } from "../Model";
import { ResponseAdapter } from "./BinderResponse";
/**
 * The Model.fromBackend method, in a seperate file, because the relationship parsing is too damn complicated to be
 * done directly in the model
 *
 * @param input
 */
export default function fromBackend<T>(this: Model<T>, input: ResponseAdapter<T>): void;
