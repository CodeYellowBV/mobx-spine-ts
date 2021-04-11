import {Model, ModelData, ModelOptions} from "Model";
import {IObservableArray, observable} from "mobx";
import {modelResponseAdapter, ResponseAdapter} from "./Model/BinderResponse";

export class Store<T, U extends Model<T>> {
    models: IObservableArray<Model<T>> = observable([]);
    __activeRelations: string[] = []

    Model: (new (data?: T, options?: ModelOptions<T>) => Model<T>) = null;


    public fromBackend<T>(input: ResponseAdapter<T>): void {
        const response = modelResponseAdapter(input);

        this.models.replace(
            (response.data as T[]).map(
                // (ModelData: T) is not working????
                (modelData: ModelData) => {
                    const model = this.__newModel();
                    model.fromBackend(
                        {
                            data: modelData,
                            with: response.with,
                            meta: response.meta,
                            with_mapping: response.with_mapping
                        }
                    );
                    return model;
                }
            )
        )
    }

    protected __newModel(data?: T): Model<T> {
        return new this.Model(data, {
            store: this,
            relations: this.__activeRelations
        })
    }
}