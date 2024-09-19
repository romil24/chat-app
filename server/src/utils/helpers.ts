import fs from "fs";
// import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import logger from "../logger/winston.logger";

// export const filterObjectKeys = (
//   fieldsArray: string[],
//   objectArray: Record<string, any>[]
// ): Record<string, any>[] => {
//   const filteredArray = structuredClone(objectArray).map(
//     (originalObj: Record<string, any>) => {
//       let obj: Record<string, any> = {};
//       structuredClone(fieldsArray)?.forEach((field) => {
//         if (field?.trim() in originalObj) {
//           obj[field] = originalObj[field];
//         }
//       });
//       if (Object.keys(obj).length > 0) return obj;
//       return originalObj;
//     }
//   );
//   return filteredArray;
// };

// export const getPaginatedPayload = (
//   dataArray: any[],
//   page: number,
//   limit: number
// ) => {
//   const startPosition = +(page - 1) * limit;

//   const totalItems = dataArray.length; // total documents present after applying search query
//   const totalPages = Math.ceil(totalItems / limit);

//   dataArray = structuredClone(dataArray).slice(
//     startPosition,
//     startPosition + limit
//   );

//   const payload = {
//     page,
//     limit,
//     totalPages,
//     previousPage: page > 1,
//     nextPage: page < totalPages,
//     totalItems,
//     currentPageItems: dataArray?.length,
//     data: dataArray,
//   };
//   return payload;
// };

export const getStaticFilePath = (req: Request, fileName: string) => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

export const getLocalPath = (fileName: string) => {
  return `public/images/${fileName}`;
};

export const removeLocalFile = (localPath: string) => {
  fs.unlink(localPath, (err) => {
    if (err) logger.error("Error while removing local files: ", err);
    else {
      logger.info("Removed local: ", localPath);
    }
  });
};

export const removeUnusedMulterImageFilesOnError = (req: {
  file: any;
  files: any;
}) => {
  try {
    const multerFile = req.file;
    const multerFiles = req.files;

    if (multerFile) {
      // If there is file uploaded and there is validation error
      // We want to remove that file
      removeLocalFile(multerFile.path);
    }

    if (multerFiles) {
      const filesValueArray = Object.values(multerFiles);
      filesValueArray.map((fileFields: any) => {
        fileFields.map((fileObject: any) => {
          removeLocalFile(fileObject.path);
        });
      });
    }
  } catch (error) {
    // fail silently
    logger.error("Error while removing image files: ", error);
  }
};

// export const getMongoosePaginationOptions = ({
//   page = 1,
//   limit = 10,
//   customLabels,
// }: {
//   page: number;
//   limit: number;
//   customLabels: mongoose.CustomLabels;
// }): mongoose.PaginateOptions => {
//   return {
//     page: Math.max(page, 1),
//     limit: Math.max(limit, 1),
//     pagination: true,
//     customLabels: {
//       pagingCounter: "serialNumberStartFrom",
//       ...customLabels,
//     },
//   };
// };

// export const getRandomNumber = (max: number) => {
//   return Math.floor(Math.random() * max);
// };
