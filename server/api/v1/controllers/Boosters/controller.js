import responseMessage from "../../../../../assets/responseMessage";
import Joi from "joi";
import axios from "axios";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";

import { userServices } from "../../services/user";

const { findUser } = userServices;

import { BoosterServices } from "../../services/booster";
import { BoosterSettingServices } from "../../services/boosterSettings";
import { BoosterTransactionServices } from "../../services/boosterTransaction";



export class BoosterController {
  async Boosterstatus(req, res, next) {
    const validationSchema = {
      Amount: Joi.number().optional(),
      Booster_Id: Joi.string().optional(),
      BoosterStart: Joi.string().optional(),
      Hash: Joi.string().optional()
    };

    const validatedBody = await Joi.validate(req.body, validationSchema);

    let userResult = await findUser({ _id: req.userId });
    if (!userResult) {
      throw apiError.notFound(responseMessage.USER_NOT_FOUND);
    }

    if (req.query.id && validatedBody.BoosterStart) {
      const boosterData = await BoosterServices.findBoosterById(
        validatedBody.Booster_Id
      );

      if (!boosterData) {
        throw apiError.notFound(responseMessage.BOOSTER_NOT_FOUND);
      };

      const BoosterEnd = new Date(
        new Date(validatedBody.BoosterStart).getTime() +
        boosterData.Timer_InMinutes * 60000
      );


      const updateBoosterStatus =
        await BoosterTransactionServices.updateBoosterTransaction(
          { User_Id: req.userId, _id: req.query.id },
          {
            BoosterStart: validatedBody.BoosterStart,
            BoosterEnd,
            Status: "ACTIVE",
          }
        );

      if (!updateBoosterStatus) {
        throw apiError.notFound(responseMessage.BOOSTERSTATUS_NOT_FOUND);
      }

      const userBoosterEndTime = userResult.BoosterEndTime
        ? new Date(userResult.BoosterEndTime)
        : BoosterEnd;
      console.log(userBoosterEndTime, "userResult.BoosterEndTime");
      const timeDifference = BoosterEnd - userBoosterEndTime;
      const finalTimestamp = userResult.BoosterEndTime ? new Date(BoosterEnd.getTime() + timeDifference) : BoosterEnd;


      // Update user's booster end time using the service
      await userServices.updateUserBoosterEndTime(req.userId, finalTimestamp);

      const timeUntilEnd = BoosterEnd.getTime() - Date.now();
      setTimeout(async () => {
        // Mark booster as completed using the service
        await BoosterTransactionServices.updateBoosterStatus(req.query.id, "COMPLETED");
        // await userServices.updateUserBoosterEndTime(req.userId, null);
        console.log(`Booster with ID ${req.query.id} has been marked as Completed.`);
      }, timeUntilEnd);

      return res.json(
        new response([], responseMessage.BOOSTER_ACTIVATION_SUCCESS)
      );
    } else {

      if (!validatedBody.Amount || !validatedBody.Booster_Id || !validatedBody.Hash) {
        return res.status(400).json({ status: "Fail", message: "All fields are required" });
      }

      // setTimeout(async () => {
      //   await axios.get(`https://tonapi.io/v2/traces/${validatedBody.Hash}`)
      //     .then(async (responsedata) => {
      //       const transactionData = {
      //         User_Id: req.userId,
      //         Amount: validatedBody.Amount,
      //         Booster_Id: validatedBody.Booster_Id,
      //         TransactionHash: validatedBody.Hash
      //       };

      //       await BoosterTransactionServices.createBoosterTransaction(transactionData)

      //       return res.json(new response([], "Activate your booster in your profile."))
      //     })
      //     .catch((error) => {
      //       return next(apiError.internal("Invalid Transaction, please retry again"));
      //     })

      // }, 15000)
      setTimeout(async () => {

        const tonApiResponse = await axios
          .get(`https://tonapi.io/v2/traces/${validatedBody.Hash}`)
          .then(res => res.data)
          .catch(() => null);
        console.log(tonApiResponse.transaction.action_phase.fwd_fees, "tonApiResponse");

        if (!tonApiResponse || tonApiResponse.transaction.action_phase.fwd_fees <= 0) {
          return next(apiError.internal("Invalid Transaction, please retry again"));
        }
        await BoosterTransactionServices.createBoosterTransaction({
          User_Id: req.userId,
          Amount: validatedBody.Amount,
          Booster_Id: validatedBody.Booster_Id,
          TransactionHash: validatedBody.Hash
        })

        return res.json(new response([], "Activate your booster in your profile."))


      }, 15000)

    }
  };


  async Boostersetting(req, res, next) {


    let validationSchema = {
      BoosterWalletAddress: Joi.string().required(),
      BoosterMintAddress: Joi.string().required(),
      Booster_Note1: Joi.string().required(),
      Booster_Note2: Joi.string().required(),
      Booster_Note2: Joi.string().required(),
      Booster_Content: Joi.string().required(),
      Status: Joi.string().allow('').optional(),
      id: Joi.string().allow('').optional()
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      if (validatedBody.id) {
        const existingBoostersetting = await BoosterSettingServices.findBoosterSettingById(validatedBody.id);
        if (!existingBoostersetting) {
          throw apiError.notFound({
            status: "Fail",
            message: "Booster not found"
          });

        }

        const UpdateBooster = await BoosterSettingServices.updateBoosterSettingById(
          { _id: validatedBody.id },
          {
            BoosterWalletAddress: validatedBody.BoosterWalletAddress,
            BoosterMintAddress: validatedBody.BoosterMintAddress,
            Booster_Note1: validatedBody.Booster_Note1,
            Booster_Note2: validatedBody.Booster_Note2,
            Booster_Content: validatedBody.Booster_Content,
            Status: validatedBody.Status,
            AddedBy: req.userId,

          },
          { new: true }
        );

        if (!UpdateBooster) {
          throw apiError.notFound({
            status: "Fail",
            message: "Unable to Update Booster Settings"
          });

        }
        return res.json(new response({ UpdateBooster, message: `Booster settings updated successfully` }))

      } else {
        const result = await BoosterSettingServices.createBoosterSetting({
          BoosterWalletAddress: validatedBody.BoosterWalletAddress,
          BoosterMintAddress: validatedBody.BoosterMintAddress,
          Booster_Note1: validatedBody.Booster_Note1,
          Booster_Note2: validatedBody.Booster_Note2,
          Booster_Content: validatedBody.Booster_Content,
          AddedBy: req.userId,

        });

        if (!result) {
          return res.status(404).json({
            status: "Fail",
            message: "Unable to Create Booster"
          });
        }
        return res.json(new response(result, `Booster Settings created successfully`))

      }
    } catch (error) {
      return next(error);
    }

  };

  async GetBoosterSettings(req, res, next) {
    try {
      if (req.body.id) {
        var result = await BoosterSettingServices.findBoosterSettingAll({ _id: req.body.id });
        if (!Boostersetting) {
          throw apiError.notFound({
            status: "Fail",
            message: "Boostersetting not found"
          });
        }
      } else {
        var result = await BoosterSettingServices.findBoosterSettingAll({});
      }

      return res.json(new response(result, `Boostersetting data retreived successfully`))
    } catch (error) {
      return next(error);
    }

  };
  async AddBoosters(req, res, next) {
    let validationSchema = {
      Id: Joi.string().optional(),
      Name: Joi.string().required(),
      Image: Joi.string().optional(),
      Price: Joi.number().optional(),
      Description: Joi.string().optional(),
      Timer_InMinutes: Joi.number().optional(),
      Booster_Multiplier: Joi.number().optional(),
      Status: Joi.string().optional()
    }
    const validatedBody = await Joi.validate(req.body, validationSchema);

    try {
      // const existingbooster = await BoosterServices.findBoosterAll({Name: Name});

      if (validatedBody.Id) {
        // Fetch the current booster data to check if it exists
        const existingBooster = await BoosterServices.findBoosterById(validatedBody.Id);
        if (!existingBooster) {
          throw apiError.notFound({
            status: "Fail",
            message: "Booster not found"
          });
        }

        // Update booster data
        const result = await BoosterServices.updateBoosterById(
          { _id: validatedBody.Id },
          {
            Name: validatedBody.Name,
            Image: validatedBody.Image,
            Price: validatedBody.Price,
            Description: validatedBody.Description,
            Timer_InMinutes: validatedBody.Timer_InMinutes,
            AddedBy: req.userId,
            Booster_Multiplier: validatedBody.Booster_Multiplier,
            Status: validatedBody.Status
          },
          { new: true }
        );

        if (!result) {
          throw apiError.badRequest({
            status: "Fail",
            message: "Unable to Update Booster"
          });
        }

        return res.json(new response(result, `Booster  updated  successfully`));
      } else {
        const existingbooster = await BoosterServices.findBoosterAll({
          Name: validatedBody.Name,
        });
        if (existingbooster.length > 0) {
          throw apiError.notFound({
            status: "Fail",
            message: "Booster Name Already Exist",
          });
        }
        // Create a new booster if no ID is provided
        const result = await BoosterServices.createBooster({
          Name: validatedBody.Name,
          Image: validatedBody.Image,
          Price: validatedBody.Price,
          Description: validatedBody.Description,
          Timer_InMinutes: validatedBody.Timer_InMinutes,
          AddedBy: req.userId,
          Booster_Multiplier: validatedBody.Booster_Multiplier,

        });

        if (!result) {
          throw apiError.badRequest({
            status: "Fail",
            message: "Unable to Create Booster"
          });
        }

        return res.json(new response(result, "Booster created successfully"));
      }
    } catch (error) {
      return next(error);
    }

  };


  async GetBoosters(req, res, next) {
    try {
      let result;
      if (req.query.id) {
        result = await BoosterServices.findBoosterAll({ _id: req.query.id });
        if (!result) {
          throw apiError.notFound({
            status: "Fail",
            message: "Unable to get Booster"
          })
        }
      } else {
        result = await BoosterServices.findBoosterAll();
        if (!result) {
          throw apiError.notFound({
            status: "Fail",
            message: "Unable to get all Booster"
          })
        }
      }
      return res.json(new response(result, "Booster data retreived successfully"))
    } catch (error) {
      return next(error)
    }

  }


  async GetUserBoosters(req, res, next) {
    let validationSchema = {
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      search: Joi.string().optional(),
      startDate: Joi.string().optional(),
      endDate: Joi.string().optional()
    }
    try {

      const validatedBody = await Joi.validate(req.query, validationSchema);



      const result = await BoosterTransactionServices.paginateBoosterTransaction(validatedBody);
      if (!result || result.length === 0) {
        throw apiError.notFound({
          status: 'Fail',
          message: 'No boosters found',
        });
      }

      return res.json(new response(
        result,
        'Booster data retrieved successfully',
      ));
    } catch (error) {
      return next(error);
    }
  };


  async getuserboosters(req, res, next) {
    const validationSchema = {
      Booster_Id: Joi.string().optional(),
    };

    try {
      // Validate the request body asynchronously
      const validatedBody = await Joi.validate(req.body, validationSchema);


      let userResult = await findUser({ _id: req.userId });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      const userData = await userServices.getUserBoosterEndTime(req.userId);



      if (validatedBody.Booster_Id && req.query.id) {
        var result = await BoosterServices.getBoosterByIdAndBoosterId(req.query.id, validatedBody.Booster_Id, req.userId);


      } else if (validatedBody.Booster_Id) {
        var result = await BoosterServices.getBoostersByBoosterId(validatedBody.Booster_Id, req.userId);

      } else {
        var result = await BoosterServices.getAllBoosters(req.userId);

      }

      if (!result) {
        throw apiError.notFound(responseMessage.BOOSTER_NOT_FOUND);
      }
      return res.json(new response(result, responseMessage.GET_USERBOOSTER_SUCCESS));

    } catch (error) {
      console.error('getUserBoosters Controller Error:', error);
      return next(error);
    }
  };


  async getboosters(req, res, next) {
    try {

      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const userData = await userServices.getUserBoosterEndTime(req.userId);

      const mint = await BoosterSettingServices.findBoosterSetting({ Status: "ACTIVE" });


      if (!mint) {
        return res.json(new response(null, responseMessage.BOOSTERSETTINGS_NOT_FOUND));
      }
      const boosters = await BoosterServices.findBoosterAll();
      if (!boosters) {
        return res.json(new response(null, responseMessage.BOOSTER_NOT_FOUND));
      }

      const result = {
        data: boosters,
        BoosterTimedata: userData,
        mint: mint
      };

      return res.json(new response(result, responseMessage.GET_BOOSTERS_SUCCESS));
    } catch (error) {
      return next(error);
    }
  };


  async GenerateSolTransferUrl(req, res, next) {
    const validationSchema = {
      boosterSolPrice: Joi.number().required(),
      Symbol: Joi.string().required(),
    };

    try {
      // Validate the request body asynchronously
      const validatedBody = await Joi.validate(req.body, validationSchema);


      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      const userbooster = await BoosterServices.findBoosterById(req.query.id);


      if (!userbooster) {
        throw apiError.notFound(responseMessage.USERBOOSTER_NOT_FOUND);
      }

      const userwallet = await BoosterServices.getUserWalletByUserId(
        req.userId
      );

      if (!userwallet) {
        throw apiError.notFound(responseMessage.USERWALLET_NOT_FOUND);
      }

      // Fetch the active mint address
      const mintAddress = await BoosterSettingServices.findBoosterSetting({
        Status: "ACTIVE",
      });

      if (!mintAddress) {
        throw apiError.notFound(responseMessage.BOOSTERSETTINGS_NOT_FOUND);
      }

      // Check if the mint address is default or not
      if (
        mintAddress.BoosterMintAddress !==
        "So11111111111111111111111111111111111111112"
      ) {
        var qrCodeUri = `solana:${userwallet.wallet}?amount=${encodeURIComponent(validatedBody.boosterSolPrice)}&spl-token=${encodeURIComponent(mintAddress.BoosterMintAddress)}&network=${"mainnet-beta"}&symbol=${encodeURIComponent(validatedBody.Symbol)}`;
        var phantomUri = `https://phantom.app/ul/v1/send?recipient=${encodeURIComponent(userwallet.wallet)}&amount=${encodeURIComponent(validatedBody.boosterSolPrice)}&spl-token=${encodeURIComponent(mintAddress.BoosterMintAddress)}&network=${encodeURIComponent("mainnet-beta")}&redirect_link=${encodeURIComponent(qrCodeUri)}`;
      } else {
        var qrCodeUri = `solana:${userwallet.wallet
          }?amount=${encodeURIComponent(
            validatedBody.boosterSolPrice
          )}&network=${"mainnet-beta"}`;
        var phantomUri = `https://phantom.app/ul/v1/send?recipient=${encodeURIComponent(
          userwallet.wallet
        )}&amount=${encodeURIComponent(
          validatedBody.boosterSolPrice
        )}&network=${encodeURIComponent(
          "mainnet-beta"
        )}&redirect_link=${encodeURIComponent(qrCodeUri)}`;
      }



      const result = {
        data: qrCodeUri,
        phantomUri,
        WalletAdddress: userwallet.wallet,
      };
      return res.json(
        new response(
          result,
          responseMessage.USDT_TRANSFERURLS_GENERATED_SUCCESS
        )
      );
    } catch (error) {
      console.error("Error generating USDT transaction URLs:", error);
      return next(error);
    }
  }

  // async Boosterstatus(req, res, next) {
  //   const validationSchema = {
  //     Amount: Joi.number().optional(),
  //     Booster_Id: Joi.string().optional(),
  //     BoosterStart: Joi.string().optional(),
  //   };

  //   const validatedBody = await Joi.validate(req.body, validationSchema);

  //   let userResult = await findUser({ _id: req.userId });
  //   if (!userResult) {
  //     throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  //   }

  //   if (req.query.id && validatedBody.BoosterStart) {
  //     const boosterData = await BoosterServices.findBoosterById(
  //       validatedBody.Booster_Id
  //     );

  //     if (!boosterData) {
  //       throw apiError.notFound(responseMessage.BOOSTER_NOT_FOUND);
  //     };

  //     const BoosterEnd = new Date(
  //       new Date(validatedBody.BoosterStart).getTime() +
  //         boosterData.Timer_InMinutes * 60000
  //     );


  //     const updateBoosterStatus =
  //       await BoosterTransactionServices.updateBoosterTransaction(
  //         { User_Id: req.userId, _id: req.query.id },
  //         {
  //           BoosterStart: validatedBody.BoosterStart,
  //           BoosterEnd,
  //           Status: "ACTIVE",
  //         }
  //       );

  //     if (!updateBoosterStatus) {
  //       throw apiError.notFound(responseMessage.BOOSTERSTATUS_NOT_FOUND);
  //     }

  //     const userBoosterEndTime = userResult.BoosterEndTime
  //       ? new Date(userResult.BoosterEndTime)
  //       : BoosterEnd;

  //     const timeDifference = BoosterEnd - userBoosterEndTime;
  //     const finalTimestamp = userResult.BoosterEndTime ? new Date(BoosterEnd.getTime() + timeDifference) : BoosterEnd;


  //     // Update user's booster end time using the service
  //     await userServices.updateUserBoosterEndTime(req.userId, finalTimestamp);

  //     const timeUntilEnd = BoosterEnd.getTime() - Date.now();
  //     setTimeout(async () => {
  //       // Mark booster as completed using the service
  //       await BoosterTransactionServices.updateBoosterStatus(req.query.id, "COMPLETED");
  //       console.log(`Booster with ID ${req.query.id} has been marked as Completed.`);
  //     }, timeUntilEnd);

  //     return res.json(
  //       new response([], responseMessage.BOOSTER_ACTIVATION_SUCCESS)
  //     );
  //   } else {

  //     if (!validatedBody.Amount || !validatedBody.Booster_Id) {
  //       return res.status(400).json({ status: "Fail", message: "All fields are required" });
  //     }

  //     // const boostersettings = await boostersetting.findOne({ Status: "Active" })
  //     const boostersettings = await BoosterSettingServices.findBoosterSetting({ Status: "ACTIVE" });
  //     const connection = new Connection(process.env.SOLANA_RPC_URL);
  //     // const userWallet = await User.findOne({ user_id: userId });
  //     const userWallet = await BoosterServices.getUserWalletByUserId(req.userId);
  //     if (!userWallet) {
  //       throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  //     }

  //     const middleWallet = Keypair.fromSecretKey(
  //       Uint8Array.from(Buffer.from(userWallet.private_key, "hex"))
  //     );
  //     const mainWalletAddress = new PublicKey(boostersettings.BoosterWalletAddress);

  //     const fixedPrivateKeyWallet = Keypair.fromSecretKey(bs58.decode(process.env.Gas_Fee_Wallet_Key))



  //     async function transferToken(gasPayerWallet, fromWallet, toAddress, validMintAddress, amount, retries = 3, delay = 5000) {
  //       try {
  //         if (!validMintAddress) {
  //           throw new Error("Invalid mint address: Mint address is undefined or empty.");
  //         }
  //         const mintInfo = await getMint(connection, new PublicKey(validMintAddress));

  //         const mint = new PublicKey(validMintAddress);
  //         const usdtAmount = BigInt(parseFloat(amount) * Math.pow(10, mintInfo.decimals));
  //         const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  //         const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
  //           connection,
  //           gasPayerWallet,
  //           mint,
  //           fromWallet.publicKey
  //         );

  //         const toTokenAccount = await getOrCreateAssociatedTokenAccount(
  //           connection,
  //           gasPayerWallet,
  //           mint,
  //           toAddress
  //         );

  //         // Perform the token transfer
  //         const transferSignature = await transfer(
  //           connection,
  //           gasPayerWallet,
  //           fromTokenAccount.address,
  //           toTokenAccount.address,
  //           fromWallet.publicKey,
  //           usdtAmount,
  //           [fromWallet], // Add fromWallet to the signers array
  //           {
  //             recentBlockhash: blockhash,
  //             lastValidBlockHeight: lastValidBlockHeight,
  //             commitment: 'confirmed' // Optional: sets the commitment level
  //           }
  //         );

  //         return transferSignature;

  //       } catch (error) {
  //         console.error('Failed to transfer tokens:', error);

  //         if (error instanceof SendTransactionError) {
  //           console.error("SendTransactionError occurred.");
  //           if (error instanceof SendTransactionError && retries > 0) {
  //             console.log(`Retrying... (${retries} attempts left)`);
  //             await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
  //             return transferToken(gasPayerWallet, fromWallet, toAddress, validMintAddress, amount, retries - 1, delay);
  //           } else {
  //             throw new Error('Max retry attempts reached or non-retryable error. Transfer failed.');
  //           }
  //         }


  //       }
  //     }


  //     const confirmTransactionOnSolscan = async (signature) => {
  //       const options = {
  //         method: "get",
  //         url: `${process.env.SOlSCAN_API_URL}${signature}`, // Corrected string interpolation
  //         headers: {
  //           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzE0MDQzNDI4NTEsImVtYWlsIjoiaW5mb0BzdHJpbmdtZXRhdmVyc2UuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzMxNDA0MzQyfQ.SMLho5s-_pTBHYlZj2qV3OEq9Qwy8mh859xApQRcoBs"
  //         }
  //       };


  //       try {
  //         const responsedata = await axios(options);
  //         if (responsedata && responsedata.data.data.transfers) {
  //           const transactionData = {
  //             User_Id: req.userId,
  //             Amount: validatedBody.Amount,
  //             Booster_Id: validatedBody.Booster_Id,
  //             TransactionHash: signature
  //           };
  //           await BoosterTransactionServices.createBoosterTransaction(transactionData);
  //           return responsedata.data.data.transfers
  //         }
  //       } catch (err) {
  //         console.error("Error in Solscan API call:", err);
  //       }
  //     };


  //     async function transferSolToken(gasPayerWallet, fromwallet, towallet, amount, retries = 5, delay = 5000) {
  //       try {
  //         const feebalance = await connection.getBalance(fromwallet.publicKey);
  //         const gasPayerBalance = await connection.getBalance(gasPayerWallet.publicKey);

  //         if (gasPayerBalance <= 0) throw new Error("Insufficient balance in gasPayerWallet");

  //         const transaction = new Transaction().add(
  //           SystemProgram.transfer({
  //             fromPubkey: fromwallet.publicKey,
  //             toPubkey: towallet,
  //             lamports: amount,
  //           })
  //         );

  //         transaction.feePayer = gasPayerWallet.publicKey;
  //         const { blockhash } = await connection.getLatestBlockhash();
  //         transaction.recentBlockhash = blockhash;

  //         transaction.partialSign(fromwallet);
  //         transaction.partialSign(gasPayerWallet);

  //         const transactionHash = await sendAndConfirmTransaction(
  //           connection,
  //           transaction,
  //           [fromwallet, gasPayerWallet],
  //           {
  //             commitment: 'confirmed',
  //             preflightCommitment: 'processed'
  //           }
  //         );

  //         return transactionHash;

  //       } catch (error) {
  //         console.error('Failed to transfer SOL tokens:', error);

  //         // Check if the error is an instance of SendTransactionError
  //         if (error instanceof SendTransactionError) {
  //           console.log("SendTransactionError encountered. Fetching transaction logs...");

  //           // Retrieve logs from the error
  //           const logs = error.transactionLogs || [];
  //           console.error("Transaction logs:", logs.join('\n'));

  //           if (retries > 0) {
  //             console.log(`Retrying... (${retries} attempts left)`);
  //             await new Promise(resolve => setTimeout(resolve, delay));
  //             return transferSolToken(gasPayerWallet, fromwallet, towallet, amount, retries - 1, delay);
  //           }
  //         } else {
  //           console.error("Non-retryable error encountered.");
  //         }

  //         throw new Error('Max retry attempts reached or non-retryable error. Transfer failed.');
  //       }
  //     }


  //     const middlewalletsolbal = await connection.getBalance(middleWallet.publicKey);
  //     const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
  //       new PublicKey(middleWallet.publicKey),
  //       {
  //         programId: new PublicKey(TOKEN_PROGRAM_ID),
  //       }
  //     );

  //     if (tokenAccounts && tokenAccounts.value.length > 0) {
  //       var middlewallettokenbal = tokenAccounts.value.map((accountInfo) => {
  //         const accountData = accountInfo.account.data.parsed;
  //         return {
  //           mint: accountData.info.mint,
  //           balance: accountData.info.tokenAmount.uiAmount,
  //         };
  //       });
  //     } else {

  //       var middlewallettokenbal = [
  //         {
  //           mint: " ",
  //           balance: 0,
  //         },
  //       ];
  //     }





  //     // if (middlewallettokenbal[0]?.mint !== "So11111111111111111111111111111111111111112" && middlewallettokenbal[0].balance >= Amount) {
  //       if (Array.isArray(middlewallettokenbal) && middlewallettokenbal.length > 0 && middlewallettokenbal[0].mint !== "So11111111111111111111111111111111111111112" && middlewallettokenbal[0].balance >= validatedBody.Amount
  //       ) {


  //       const tokenstransferdata = await transferToken(fixedPrivateKeyWallet, middleWallet, mainWalletAddress, middlewallettokenbal[0].mint, middlewallettokenbal[0].balance);
  //       if (!tokenstransferdata) {
  //         return res.status(404).json({
  //           status: "Fail",
  //           message: "Failed to transfer middle wallet balance."
  //         });
  //       }
  //       const confirmtransaction = await confirmTransactionOnSolscan(tokenstransferdata);

  //       if (!confirmtransaction) {
  //         return res.status(404).json({
  //           status: "Fail",
  //           message: "Failed to confirm transaction on solscan."
  //         });
  //       }
  //       return res.status(200).json({
  //         status: "Success",
  //         message: "You can activate your booster in your profile."
  //       });


  //     } else if (middlewalletsolbal >= validatedBody.Amount) {


  //       const tokenstransferdata = await transferSolToken(fixedPrivateKeyWallet, middleWallet, mainWalletAddress, middlewalletsolbal);
  //       if (!tokenstransferdata) {
  //         return res.status(404).json({
  //           status: "Fail",
  //           message: "Failed to transfer middle wallet balance."
  //         });
  //       }
  //       const confirmtransaction = await confirmTransactionOnSolscan(tokenstransferdata);
  //       if (!confirmtransaction) {
  //         return res.status(404).json({
  //           status: "Fail",
  //           message: "Failed to confirm transaction."
  //         });
  //       }
  //       return res.status(200).json({
  //         status: "Success",
  //         message: "You can activate your booster in your profile."
  //       });
  //     } else {
  //       return res.status(404).json({
  //         status: "Fail",
  //         message: "Insufficient balance or No balances found in your wallet check your hash and retry update balance"
  //       });
  //     }
  //   }
  // };



}

export default new BoosterController();
