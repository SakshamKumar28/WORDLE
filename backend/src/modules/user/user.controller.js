import User from "./user.model.js";
import FriendRequest from "./friendRequest.model.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { getIo } from "../../sockets/socketHandler.js";

class UserController {
    async getFriends(req, res, next) {
        try {
            const user = await User.findById(req.user.id).populate("friends", "firstName lastName email stats");
            if (!user) {
                throw new ApiError(404, "User not found");
            }
            res.status(200).json(apiResponse(200, user.friends, "Friends fetched successfully"));
        } catch (error) {
            next(error);
        }
    }

    async getLeaderboard(req, res, next) {
        try {
            // Sort by wins in descending order, limit to top 10
            const leaderboard = await User.find()
                .sort({ "stats.wins": -1 })
                .limit(10)
                .select("firstName lastName stats");
            
            res.status(200).json(apiResponse(200, leaderboard, "Leaderboard fetched successfully"));
        } catch (error) {
            next(error);
        }
    }

    async sendFriendRequest(req, res, next) {
        try {
            const { receiverEmail } = req.body;
            const senderId = req.user.id;
            
            const receiver = await User.findOne({ email: receiverEmail });
            if (!receiver) {
                throw new ApiError(404, "User with this email not found");
            }

            if (receiver._id.toString() === senderId.toString()) {
                throw new ApiError(400, "You cannot send a friend request to yourself");
            }

            // Check if already friends
            const sender = await User.findById(senderId);
            if (sender.friends.includes(receiver._id)) {
                throw new ApiError(400, "You are already friends with this user");
            }

            // Check if request already exists
            const existingRequest = await FriendRequest.findOne({
                sender: senderId,
                receiver: receiver._id,
                status: "pending"
            });

            if (existingRequest) {
                throw new ApiError(400, "Friend request already sent");
            }

            const friendRequest = await FriendRequest.create({
                sender: senderId,
                receiver: receiver._id
            });

            // Push real-time notification to receiver
            const io = getIo();
            if (io) {
                const populatedRequest = await FriendRequest.findById(friendRequest._id)
                    .populate("sender", "firstName lastName email");
                io.to(`user:${receiver._id.toString()}`).emit("friendRequestReceived", populatedRequest);
            }

            res.status(201).json(apiResponse(201, friendRequest, "Friend request sent successfully"));
        } catch (error) {
            next(error);
        }
    }

    async getFriendRequests(req, res, next) {
        try {
            const requests = await FriendRequest.find({ receiver: req.user.id, status: "pending" })
                .populate("sender", "firstName lastName email");
            
            res.status(200).json(apiResponse(200, requests, "Friend requests fetched successfully"));
        } catch (error) {
            next(error);
        }
    }

    async respondToFriendRequest(req, res, next) {
        try {
            const { requestId, action } = req.body; // action: 'accept' or 'reject'
            const receiverId = req.user.id;

            const friendRequest = await FriendRequest.findById(requestId);
            if (!friendRequest) {
                throw new ApiError(404, "Friend request not found");
            }

            if (friendRequest.receiver.toString() !== receiverId.toString()) {
                throw new ApiError(403, "You are not authorized to respond to this request");
            }

            if (friendRequest.status !== "pending") {
                throw new ApiError(400, "This request has already been responded to");
            }

            if (action === "accept") {
                friendRequest.status = "accepted";
                await friendRequest.save();

                // Add to each other's friends list
                await User.findByIdAndUpdate(friendRequest.sender, { $addToSet: { friends: receiverId } });
                await User.findByIdAndUpdate(receiverId, { $addToSet: { friends: friendRequest.sender } });

                // Push real-time updates to both users
                const io = getIo();
                if (io) {
                    const senderId = friendRequest.sender.toString();
                    const receiverIdStr = receiverId.toString();

                    // Fetch updated friends lists for both users
                    const [updatedSender, updatedReceiver] = await Promise.all([
                        User.findById(senderId).populate("friends", "firstName lastName email stats"),
                        User.findById(receiverId).populate("friends", "firstName lastName email stats")
                    ]);

                    // Notify sender that their request was accepted + updated friends list
                    io.to(`user:${senderId}`).emit("friendRequestAccepted", {
                        requestId: friendRequest._id,
                        acceptedBy: { _id: receiverId, firstName: updatedReceiver?.firstName, lastName: updatedReceiver?.lastName }
                    });
                    io.to(`user:${senderId}`).emit("friendsListUpdated", updatedSender?.friends || []);

                    // Notify receiver with updated friends list
                    io.to(`user:${receiverIdStr}`).emit("friendsListUpdated", updatedReceiver?.friends || []);
                }

                res.status(200).json(apiResponse(200, null, "Friend request accepted"));
            } else if (action === "reject") {
                friendRequest.status = "rejected";
                await friendRequest.save();

                // Notify sender that their request was rejected
                const io = getIo();
                if (io) {
                    io.to(`user:${friendRequest.sender.toString()}`).emit("friendRequestResponded", {
                        requestId: friendRequest._id,
                        action: "rejected"
                    });
                }

                res.status(200).json(apiResponse(200, null, "Friend request rejected"));
            } else {
                throw new ApiError(400, "Invalid action");
            }
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
