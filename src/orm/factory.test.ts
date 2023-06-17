import { IEntity } from "./collection";
import { collectionFactory, generateTypedEntity, dynamic } from "./factory";

const Task: IEntity = {
  name: 'Task',
  fields: [
    { name: 'title', dataType: 'string'}
  ]
}

// @ts-ignore
dynamic.dataSourceFactory = () => ({})

dynamic.entities = { 
  Task
};

import { ITask, Tasks } from "../../orm-types/Task";

async function main() {

  const code = generateTypedEntity(Task);
  const dynamicCollection = collectionFactory(Task);
  // const d = await dynamicCollection.get('test')
  const task = Tasks.init();
  console.log(task);

}

main()
  .then((res: any) => console.log(res ?? 'done'))
  .catch(err => console.error('ERROR', err))