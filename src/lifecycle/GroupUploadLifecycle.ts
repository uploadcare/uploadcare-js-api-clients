import { GroupUploadLifecycleInterface, LifecycleInterface } from "./types";
import { GroupInfoInterface } from "../api/types";
import { UploadcareGroupInterface } from "../types";
import { UploadcareGroup } from "../UploadcareGroup";

export class GroupUploadLifecycle implements GroupUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareGroupInterface>;

  constructor(lifecycle: LifecycleInterface<UploadcareGroupInterface>) {
    this.uploadLifecycle = lifecycle;
  }

  handleUploadedGroup(
    groupInfo: GroupInfoInterface
  ): Promise<UploadcareGroupInterface> {
    const uploadLifecycle = this.getUploadLifecycle();

    uploadLifecycle.updateEntity(UploadcareGroup.fromGroupInfo(groupInfo));
    uploadLifecycle.handleUploaded(groupInfo.id);

    return Promise.resolve(uploadLifecycle.getEntity());
  }

  getUploadLifecycle(): LifecycleInterface<UploadcareGroupInterface> {
    return this.uploadLifecycle;
  }
}
