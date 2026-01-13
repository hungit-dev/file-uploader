const { prisma } = require("../lib/prisma.js");

const getFolderHierarchy = async (userId, currentFolderId) => {
  const breadcrumbItems = [];
  while (currentFolderId) {
    const currentFolder = await prisma.folder.findFirst({
      where: {
        userId: userId,
        id: currentFolderId,
      },
    });
    breadcrumbItems.push(currentFolder);
    if (currentFolder.parentId) currentFolderId = currentFolder.parentId;
    else break;
  }
  //Add dashboard as an entry point to breadcrumb nav
  breadcrumbItems.push({ name: "Dashboard" });
  return breadcrumbItems.reverse();
};

module.exports = {
  getFolderHierarchy,
};
